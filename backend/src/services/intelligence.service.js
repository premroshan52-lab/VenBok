const { Space, Booking, TimetableOverride } = require("../models");

// ── 1. NLP Query Parser ────────────────────────────────────────────────────────
const parseNaturalQuery = (queryText = "") => {
	const text = String(queryText).toLowerCase();

	// Extract capacity (e.g., "for 300 people", "300 attendees", "capacity 500", "50 pax")
	let capacity = null;
	const capacityMatch = text.match(/(\d+)\s*(people|persons|attendees|participants|guests|students|capacity|pax)/i) ||
		text.match(/for\s+(\d+)/i);
	if (capacityMatch) {
		capacity = parseInt(capacityMatch[1], 10);
	}

	// Extract Event Type
	let eventType = "Seminar";
	if (/hackathon|coding|codefest|devfest/i.test(text)) eventType = "Hackathon";
	else if (/cultural|fest|dance|music|concert|gala|drama/i.test(text)) eventType = "Cultural";
	else if (/workshop|hands-on|bootcamp|lab/i.test(text)) eventType = "Workshop";
	else if (/conference|symposium|summit/i.test(text)) eventType = "Conference";
	else if (/wedding|reception|marriage|banquet/i.test(text)) eventType = "Wedding";
	else if (/training|placement|aptitude/i.test(text)) eventType = "Training";
	else if (/sports|tournament|badminton|cricket|volleyball/i.test(text)) eventType = "Sports";
	else if (/meeting|board|executive|roundtable/i.test(text)) eventType = "Meeting";
	else if (/exhibition|expo|showcase/i.test(text)) eventType = "Exhibition";
	else if (/club|student activity|society/i.test(text)) eventType = "Club";

	// Extract required facilities keywords
	const facilities = [];
	if (/projector|screen|display/i.test(text)) facilities.push("Projector");
	if (/sound|audio|speaker|mic/i.test(text)) facilities.push("Sound System");
	if (/ac|air condition|climate/i.test(text)) facilities.push("Air Conditioning");
	if (/stage|podium/i.test(text)) facilities.push("Stage");
	if (/wifi|internet|lan/i.test(text)) facilities.push("WiFi");
	if (/parking|valet/i.test(text)) facilities.push("Parking");
	if (/power backup|generator|ups/i.test(text)) facilities.push("Power Backup");
	if (/video conferenc|zoom|teams/i.test(text)) facilities.push("Video Conferencing");

	return {
		rawQuery: queryText,
		parsed: {
			capacity: capacity || 100,
			eventType,
			facilities,
		},
	};
};

// ── 2. Multi-Factor Recommendation & Scoring Engine ───────────────────────────
const calculateRecommendationScore = (space, criteria = {}) => {
	const targetCapacity = Number(criteria.capacity) || 100;
	const requiredFacilities = Array.isArray(criteria.facilities) ? criteria.facilities : [];
	const userLat = criteria.lat ? Number(criteria.lat) : 10.8281;
	const userLng = criteria.lng ? Number(criteria.lng) : 77.0197;

	// 1. Capacity Score (Weight: 35%)
	let capacityScore = 85;
	if (space.capacity !== null && space.capacity !== undefined) {
		if (space.capacity >= targetCapacity) {
			const ratio = space.capacity / targetCapacity;
			if (ratio <= 1.25) capacityScore = 100;
			else if (ratio <= 1.75) capacityScore = 90;
			else if (ratio <= 2.5) capacityScore = 75;
			else capacityScore = 60;
		} else {
			capacityScore = Math.max(20, Math.round((space.capacity / targetCapacity) * 80));
		}
	} else {
		capacityScore = 85;
	}

	// 2. Facilities & AV Equipment Score (Weight: 35%)
	let facilitiesScore = 100;
	if (requiredFacilities.length > 0) {
		const matched = requiredFacilities.filter((f) =>
			(space.facilities || []).some((sf) => sf.toLowerCase().includes(f.toLowerCase()))
		);
		facilitiesScore = Math.round((matched.length / requiredFacilities.length) * 100);
	}

	// 3. Rating & Quality Score (Weight: 15%)
	const ratingScore = Math.min(100, Math.round(((space.rating || 4.5) / 5) * 100));

	// 4. Institutional Verification & Proximity Score (Weight: 15%)
	const spaceLat = space.location?.lat || 10.8281;
	const spaceLng = space.location?.lng || 77.0197;
	const distanceKm = Math.round(
		Math.sqrt(Math.pow(spaceLat - userLat, 2) + Math.pow(spaceLng - userLng, 2)) * 111 * 10
	) / 10;
	let proximityScore = 100;
	if (distanceKm > 25) proximityScore = 50;
	else if (distanceKm > 10) proximityScore = 75;
	else if (distanceKm > 5) proximityScore = 90;

	// Weighted Total (100% Free / Zero money)
	let overallScore = Math.round(
		capacityScore * 0.35 +
		facilitiesScore * 0.35 +
		ratingScore * 0.15 +
		proximityScore * 0.15
	);

	// Boost verified authentic institutional venues
	if (space.isVerified) {
		overallScore = Math.min(100, overallScore + 5);
	}

	// Generate clear institutional rationale
	const capStr = space.capacity ? `${space.capacity} pax` : "flexible capacity";
	let explanation = "";
	if (overallScore >= 90) {
		explanation = `Exceptional institutional match: ${capStr}, verified technical AV infrastructure and high organizer rating (${space.rating || 4.8}★).`;
	} else if (overallScore >= 80) {
		explanation = `Strong recommendation: ${capStr} with comprehensive campus facility coverage.`;
	} else if (space.capacity && space.capacity < targetCapacity) {
		explanation = `Moderate match: Capacity (${space.capacity}) is lower than requested (${targetCapacity}), but offers specialized lab/stage equipment.`;
	} else {
		explanation = `Alternative option: Has ${capStr} with standard campus amenities.`;
	}

	return {
		overallScore,
		breakdown: {
			capacityScore,
			facilitiesScore,
			ratingScore,
			proximityScore,
		},
		distanceKm,
		explanation,
	};
};

// ── 3. Event Requirement Planner ──────────────────────────────────────────────
const EVENT_TEMPLATES = {
	Hackathon: {
		capacityBufferPercent: 20,
		requiredFacilities: ["WiFi", "Power Backup", "Air Conditioning", "Projector"],
		recommendedFacilities: ["Sound System", "Stage", "Whiteboard", "Resting Lounges"],
		checklist: [
			"High-speed dedicated LAN/WiFi bandwidth configured",
			"Continuous power backup & surge strips at each desk",
			"Overnight security and registration check-in desk",
			"Designated food, beverage and mentor evaluation zones",
		],
		defaultDurationHours: 24,
	},
	Seminar: {
		capacityBufferPercent: 10,
		requiredFacilities: ["Projector", "Sound System", "Microphones", "Stage"],
		recommendedFacilities: ["Air Conditioning", "WiFi", "Podium"],
		checklist: [
			"Cordless microphones & lapel mics tested with audio console",
			"HDMI/Type-C display connectors and presentation clicker",
			"Guest speaker green room and welcome banner",
		],
		defaultDurationHours: 4,
	},
	Conference: {
		capacityBufferPercent: 15,
		requiredFacilities: ["Air Conditioning", "Stage", "Sound System", "Projector", "WiFi"],
		recommendedFacilities: ["Video Conferencing", "Parking", "Power Backup", "Press Area"],
		checklist: [
			"Keynote stage lighting and live streaming recording setup",
			"Delegate registration badges and kit distribution counter",
			"High-capacity parking management and directional signage",
		],
		defaultDurationHours: 8,
	},
	Workshop: {
		capacityBufferPercent: 15,
		requiredFacilities: ["Computer Systems", "Projector", "Power Backup", "Air Conditioning"],
		recommendedFacilities: ["WiFi", "Whiteboard", "Sound System"],
		checklist: [
			"Software prerequisites & lab test instances pre-installed",
			"Hands-on lab assistants assigned per 25 participants",
			"Q&A cordless mic and interactive display enabled",
		],
		defaultDurationHours: 6,
	},
	Cultural: {
		capacityBufferPercent: 25,
		requiredFacilities: ["Stage", "Sound System", "Air Conditioning", "Parking"],
		recommendedFacilities: ["Acoustic Lighting", "Green Rooms", "Power Backup"],
		checklist: [
			"Full stage acoustic soundcheck & professional lighting rig",
			"Dressing rooms & green rooms reserved for performers",
			"Audience crowd control barricades and first aid post",
		],
		defaultDurationHours: 6,
	},
	Wedding: {
		capacityBufferPercent: 30,
		requiredFacilities: ["Air Conditioning", "Stage", "Parking", "Sound System"],
		recommendedFacilities: ["Dining Hall", "Bridal Suites", "Power Backup"],
		checklist: [
			"Grand stage decoration setup window scheduled",
			"Dedicated dining & catering service logistics verified",
			"Valet parking assistance and security personnel",
		],
		defaultDurationHours: 12,
	},
	Sports: {
		capacityBufferPercent: 20,
		requiredFacilities: ["Indoor Court / Ground", "First Aid Room", "Changing Rooms"],
		recommendedFacilities: ["Public Address System", "Scoreboard Display", "Parking"],
		checklist: [
			"Court line markings and tournament equipment verified",
			"Medical paramedic on-site with emergency kit",
			"Referee desk & spectator seating zone separated",
		],
		defaultDurationHours: 8,
	},
	Meeting: {
		capacityBufferPercent: 10,
		requiredFacilities: ["Air Conditioning", "Smart Display", "Video Conferencing", "WiFi"],
		recommendedFacilities: ["Whiteboard", "Power Sockets", "Coffee Station"],
		checklist: [
			"Hybrid video call bridge verified (Zoom / Teams / Meet)",
			"Executive seating arranged with notepad and water bottles",
		],
		defaultDurationHours: 2,
	},
};

const getEventPlan = (eventType = "Seminar", participantCount = 100) => {
	const template = EVENT_TEMPLATES[eventType] || EVENT_TEMPLATES.Seminar;
	const count = Number(participantCount) || 100;
	const recommendedMinCapacity = Math.round(count * (1 + template.capacityBufferPercent / 100));

	return {
		eventType,
		participantCount: count,
		recommendedMinCapacity,
		requiredFacilities: template.requiredFacilities,
		recommendedFacilities: template.recommendedFacilities,
		checklist: template.checklist,
		estimatedDurationHours: template.defaultDurationHours,
	};
};

// ── 4. Institutional Logistics & Resource Planner ─────────────────────────────
const estimateEventLogistics = (space, options = {}) => {
	const durationHours = Number(options.durationHours) || 6;
	const participants = Number(options.participants) || (space?.capacity ? Math.round(space.capacity * 0.8) : 100);
	const needsLiveStreaming = Boolean(options.liveStreaming);
	const needsExtraSound = Boolean(options.extraSound);

	// Resource specifications
	const seatingAllocation = participants;
	const microphonesRequired = participants > 200 ? 4 : 2;
	const dedicatedBandwidthMbps = Math.max(100, participants * 2);
	const powerLoadKW = (participants > 300 ? 15 : 8) + (needsLiveStreaming ? 5 : 0);
	const volunteerStaffRecommended = Math.ceil(participants / 40);

	return {
		accessType: "Free Institutional Access",
		policy: "All college venue reservations are internal and free of charge for approved academic and co-curricular events.",
		logistics: {
			seatingAllocation,
			microphonesRequired,
			dedicatedBandwidthMbps: `${dedicatedBandwidthMbps} Mbps`,
			powerLoadKW: `${powerLoadKW} kW (DG Backup Recommended)`,
			volunteerStaffRecommended,
			facilitySupport: needsLiveStreaming ? "Campus Media & Telecast Team Assigned" : "Standard AV Operator",
			audioBuffer: needsExtraSound ? "Dedicated Stage Subwoofers & Line Array" : "Standard Wall Mounted PA",
		},
	};
};

const estimateEventCost = estimateEventLogistics;

// ── 5. Utilization & Demand Analytics ─────────────────────────────────────────
const calculateUtilizationAnalytics = async (spaceId = null) => {
	const query = spaceId ? { spaceId } : {};
	const bookings = await Booking.find({
		...query,
		status: { $in: ["Approved", "Confirmed", "In Progress", "Completed"] },
	});

	const allSpaces = spaceId ? await Space.find({ _id: spaceId }) : await Space.find({ status: "active" });

	// Available operating hours per space: 10 hours daily (08:00 - 18:00)
	const totalDaysTracked = 30; // 30-day baseline
	const availableHoursPerSpace = 10 * totalDaysTracked;
	const totalAvailableHours = allSpaces.length * availableHoursPerSpace;

	let totalBookedHours = 0;
	const spaceBookedHours = new Map();
	const eventTypeRevenue = new Map();

	bookings.forEach((b) => {
		const [startH, startM] = (b.start || "09:00").split(":").map(Number);
		const [endH, endM] = (b.end || "17:00").split(":").map(Number);
		const duration = Math.max(1, (endH * 60 + endM - (startH * 60 + startM)) / 60);

		totalBookedHours += duration;

		const sId = String(b.spaceId);
		spaceBookedHours.set(sId, (spaceBookedHours.get(sId) || 0) + duration);

		const eType = b.type || "Other";
		eventTypeRevenue.set(eType, (eventTypeRevenue.get(eType) || 0) + duration);
	});

	const overallUtilization = totalAvailableHours > 0
		? Math.min(100, Math.round((totalBookedHours / totalAvailableHours) * 100 * 10) / 10)
		: 0;

	// Venue-wise utilization list
	const venueUtilization = allSpaces.map((s) => {
		const booked = spaceBookedHours.get(String(s._id)) || 0;
		const rate = Math.min(100, Math.round((booked / availableHoursPerSpace) * 100 * 10) / 10);
		return {
			id: s.id,
			name: s.name,
			capacity: s.capacity,
			bookedHours: booked,
			availableHours: availableHoursPerSpace,
			utilizationPercent: rate,
		};
	}).sort((a, b) => b.utilizationPercent - a.utilizationPercent);

	// Demand Forecast for next 3 months
	const demandForecast = [
		{ month: "October 2026", demandLevel: "High", projectedOccupancy: "82%", peakSlots: "10:00 - 16:00", factor: "Tech festivals & National Symposia" },
		{ month: "November 2026", demandLevel: "Very High", projectedOccupancy: "91%", peakSlots: "09:00 - 18:00", factor: "Placement Assessment Drives & Hackathons" },
		{ month: "December 2026", demandLevel: "Medium", projectedOccupancy: "64%", peakSlots: "13:00 - 17:00", factor: "Semester Examinations & Annual Cultural Gala" },
	];

	// Scheduling & Operations Recommendation
	const operationsAdvice = overallUtilization > 75
		? { action: "Buffer Windows", factor: "High demand: mandate 30-min setup buffer between student club events" }
		: { action: "Optimal Access", factor: "Standard operational capacity: open for academic department reservations" };

	return {
		overallUtilization,
		totalBookedHours,
		totalAvailableHours,
		venueUtilization,
		demandForecast,
		schedulingOptimization: operationsAdvice,
		hoursByEventType: Array.from(eventTypeRevenue.entries()).map(([type, hours]) => ({
			type,
			hours,
		})),
	};
};

// ── 6. Event Feasibility Engine ───────────────────────────────────────────────
/**
 * Answers: "Can this entire event realistically be conducted successfully in this venue at this time?"
 * Evaluates 4 dimensions:
 * 1. Capacity & Crowd Dynamics Buffer
 * 2. Technical Infrastructure & Concurrent Load
 * 3. Temporal Setup/Teardown Operational Buffer
 * 4. Campus Policy & Environmental Compliance
 */
const calculateEventFeasibility = async (spaceOrId, eventDetails = {}) => {
	let space = spaceOrId;
	if (!space || typeof space === "string" || !space.name) {
		space = await Space.findById(spaceOrId);
	}
	if (!space) {
		throw new Error("Venue space not found for feasibility assessment");
	}
	const plainSpace = space.toObject ? space.toObject() : space;

	const eventType = eventDetails.eventType || eventDetails.type || "Seminar";
	const participants = Number(eventDetails.participants) || 100;
	const date = eventDetails.date || new Date().toISOString().split("T")[0];
	const start = eventDetails.start || "09:00";
	const end = eventDetails.end || "17:00";
	const requirements = eventDetails.requirements || {};

	// Duration in hours
	const [startH, startM] = (start || "09:00").split(":").map(Number);
	const [endH, endM] = (end || "17:00").split(":").map(Number);
	const startMinutes = startH * 60 + startM;
	const endMinutes = endH * 60 + endM;
	const durationHours = Math.max(0.5, (endMinutes - startMinutes) / 60);

	const spaceCapacity = plainSpace.capacity || 100;
	const spaceFacilities = (plainSpace.facilities || []).map((f) => f.toLowerCase());
	const template = EVENT_TEMPLATES[eventType] || EVENT_TEMPLATES.Seminar;

	const checks = [];
	const mitigations = [];

	// ── Dimension 1: Capacity & Crowd Dynamics Buffer ──
	let capacityScore = 100;
	let capacityStatus = "PASS";
	let capacitySummary = "";
	let capacityMetric = "";
	let capacityMatch = true;

	if (plainSpace.capacity === null || plainSpace.capacity === undefined) {
		capacityScore = 85;
		capacityStatus = "INFO";
		capacityMatch = "unknown";
		capacitySummary = "Capacity information is not available in the current institutional dataset.";
		capacityMetric = `${participants} pax (Capacity not published)`;
	} else {
		const spaceCapacity = plainSpace.capacity;
		const densityRatio = participants / spaceCapacity;
		const densityPercent = Math.round(densityRatio * 100);

		if (participants > spaceCapacity) {
			capacityScore = Math.max(10, Math.round(100 - (participants - spaceCapacity) * 2));
			capacityStatus = "FAIL";
			capacityMatch = false;
			capacitySummary = `Exceeds absolute venue capacity by ${participants - spaceCapacity} attendees (${participants}/${spaceCapacity}). High safety & fire egress violation risk.`;
			mitigations.push(`Relocate to a higher-capacity venue (minimum ${participants} capacity) or split event into multiple batches.`);
		} else if (eventType === "Hackathon" && densityRatio > 0.8) {
			capacityScore = 70;
			capacityStatus = "WARNING";
			capacityMatch = true;
			capacitySummary = `High density (${densityPercent}%) for Hackathon. Hackathons require desk space for dual screens, power strips, and bags (recommended max 80% occupancy).`;
			mitigations.push(`Target maximum 80% capacity (${Math.floor(spaceCapacity * 0.8)} attendees) or arrange satellite breakout rooms for team collaboration.`);
		} else if (eventType === "Cultural" && densityRatio > 0.9) {
			capacityScore = 75;
			capacityStatus = "WARNING";
			capacityMatch = true;
			capacitySummary = `Dense crowd (${densityPercent}%). Egress paths and aisle spacing may become congested during peak stage performances.`;
			mitigations.push(`Deploy 4-6 student marshals at entry and emergency exit corridors.`);
		} else if (densityRatio < 0.25) {
			capacityScore = 80;
			capacityStatus = "INFO";
			capacityMatch = true;
			capacitySummary = `Venue is significantly oversized (${densityPercent}% occupancy: ${participants} in a ${spaceCapacity}-capacity space). Energy & HVAC allocation may be inefficient.`;
			mitigations.push(`Consider a more compact space to optimize climate control and event acoustics.`);
		} else {
			capacityScore = 100;
			capacityStatus = "PASS";
			capacityMatch = true;
			capacitySummary = `Optimal crowd density (${densityPercent}%). Provides sufficient breathing room, emergency clearance, and comfortable aisle seating.`;
		}
		capacityMetric = `${participants} / ${spaceCapacity} pax (${densityPercent}%)`;
	}

	checks.push({
		dimension: "Capacity & Density Buffer",
		status: capacityStatus,
		score: capacityScore,
		summary: capacitySummary,
		metric: capacityMetric,
		capacityMatch,
	});

	// ── Dimension 2: Technical Infrastructure & Concurrency ──
	let techScore = 100;
	let techIssues = [];
	const neededTech = template.requiredFacilities || [];
	const missingTech = [];

	neededTech.forEach((req) => {
		const hasIt = spaceFacilities.some((sf) => sf.includes(req.toLowerCase()));
		if (!hasIt) {
			missingTech.push(req);
		}
	});

	// Check WiFi concurrent devices
	const estDeviceCount = Math.round(participants * (eventType === "Hackathon" ? 2.2 : 1.2));
	const hasWifi = spaceFacilities.some((sf) => sf.includes("wifi"));
	let wifiNote = "";

	if ((eventType === "Hackathon" || eventType === "Workshop") && estDeviceCount > 100) {
		if (!hasWifi) {
			techScore -= 30;
			techIssues.push(`Missing high-speed WiFi for ${eventType} with ~${estDeviceCount} devices.`);
			mitigations.push(`Coordinate with Campus IT for portable enterprise Access Points with captive portal bypass.`);
		} else {
			wifiNote = `Estimated ~${estDeviceCount} concurrent devices. Standard WiFi will face heavy contention.`;
			mitigations.push(`Request IT Department to provision a dedicated 5GHz event VLAN and 200+ DHCP leases.`);
		}
	}

	// Check Power Backup
	const hasPowerBackup = spaceFacilities.some((sf) => sf.includes("power") || sf.includes("generator") || sf.includes("ups"));
	if ((eventType === "Hackathon" || requirements.powerBackup) && !hasPowerBackup) {
		techScore -= 25;
		techIssues.push("No dedicated uninterrupted power backup (UPS/Generator) listed for power-sensitive electronics.");
		mitigations.push("Request facility team to connect portable 15kVA silent generator or verify dual-circuit feeder backup.");
	}

	// Check Sound System
	const hasSound = spaceFacilities.some((sf) => sf.includes("sound") || sf.includes("audio") || sf.includes("mic"));
	if ((participants > 60 || eventType === "Cultural" || eventType === "Conference") && !hasSound) {
		techScore -= 20;
		techIssues.push("Venue lacks integrated acoustic sound system / PA setup for 60+ attendees.");
		mitigations.push("Requisition portable PA sound console with at least 2 UHF wireless handheld microphones.");
	}

	if (missingTech.length > 0) {
		techScore = Math.max(30, techScore - missingTech.length * 15);
	}

	let techStatus = "PASS";
	let techSummary = "";
	if (techScore >= 85) {
		techStatus = "PASS";
		techSummary = `Venue satisfies primary technical requirements. Modern AV and amenities align with ${eventType} execution.`;
	} else if (techScore >= 60) {
		techStatus = "WARNING";
		techSummary = `Minor technical bottlenecks detected (${missingTech.join(", ") || techIssues.join("; ")}).`;
	} else {
		techStatus = "FAIL";
		techSummary = `Critical infrastructure gap: Missing essential equipment (${missingTech.join(", ")}) required for a ${eventType}.`;
	}

	checks.push({
		dimension: "Technical & Infrastructure Load",
		status: techStatus,
		score: Math.max(20, Math.min(100, techScore)),
		summary: techSummary,
		metric: missingTech.length === 0 ? "All Core Equipment Available" : `${missingTech.length} Missing Requirements`,
		details: wifiNote || undefined,
	});

	// ── Dimension 3: Temporal Setup & Teardown Operational Buffer ──
	let temporalScore = 100;
	let temporalStatus = "PASS";
	let temporalSummary = "";

	// Look up same-day bookings for this space (excluding Rejected)
	const sameDayBookings = await Booking.find({
		spaceId: plainSpace.id || plainSpace._id,
		date,
		status: { $ne: "Rejected" },
	});

	// Also check academic overrides
	const academicOverrides = await TimetableOverride.find({
		spaceId: plainSpace.id || plainSpace._id,
		date,
		status: "academic",
	});

	const allEvents = [
		...sameDayBookings.map((b) => ({
			title: b.title,
			start: b.start,
			end: b.end,
			type: "booking",
		})),
		...academicOverrides.map((o) => ({
			title: o.title || "Academic Lecture / Class",
			start: o.start,
			end: o.end,
			type: "academic",
		})),
	];

	// Direct Collision Check
	const directCollision = allEvents.find((evt) => {
		const [eStartH, eStartM] = evt.start.split(":").map(Number);
		const [eEndH, eEndM] = evt.end.split(":").map(Number);
		const eStartMin = eStartH * 60 + eStartM;
		const eEndMin = eEndH * 60 + eEndM;
		return startMinutes < eEndMin && eStartMin < endMinutes;
	});

	if (directCollision) {
		temporalScore = 0;
		temporalStatus = "FAIL";
		temporalSummary = `Direct schedule conflict: Overlaps with "${directCollision.title}" scheduled from ${directCollision.start} to ${directCollision.end}.`;
		mitigations.push("Adjust event time window or select an alternative open venue.");
	} else {
		// Buffer calculations
		const recommendedSetupMinutes = eventType === "Cultural" ? 120 : eventType === "Hackathon" ? 90 : eventType === "Conference" ? 60 : 30;
		const recommendedTeardownMinutes = eventType === "Cultural" ? 60 : eventType === "Hackathon" ? 45 : 30;

		// Preceding event gap
		const precedingEvents = allEvents.filter((evt) => {
			const [eEndH, eEndM] = evt.end.split(":").map(Number);
			return eEndH * 60 + eEndM <= startMinutes;
		}).sort((a, b) => b.end.localeCompare(a.end));

		const lastPreceding = precedingEvents[0];
		let setupBufferMinutes = 999;
		if (lastPreceding) {
			const [pEndH, pEndM] = lastPreceding.end.split(":").map(Number);
			setupBufferMinutes = startMinutes - (pEndH * 60 + pEndM);
		}

		// Succeeding event gap
		const succeedingEvents = allEvents.filter((evt) => {
			const [eStartH, eStartM] = evt.start.split(":").map(Number);
			return eStartH * 60 + eStartM >= endMinutes;
		}).sort((a, b) => a.start.localeCompare(b.start));

		const nextSucceeding = succeedingEvents[0];
		let teardownBufferMinutes = 999;
		if (nextSucceeding) {
			const [nStartH, nStartM] = nextSucceeding.start.split(":").map(Number);
			teardownBufferMinutes = nStartM + nStartH * 60 - endMinutes;
		}

		if (setupBufferMinutes < recommendedSetupMinutes && setupBufferMinutes !== 999) {
			temporalScore -= 25;
			temporalStatus = "WARNING";
			temporalSummary = `Tight turnover: Only ${setupBufferMinutes} min buffer prior to start (Recommended: ${recommendedSetupMinutes} mins for ${eventType} setup). Prior event: "${lastPreceding.title}".`;
			mitigations.push(`Pre-stage registration desks in the lobby so stage AV setup can occur rapidly once the previous booking vacates.`);
		} else if (teardownBufferMinutes < recommendedTeardownMinutes && teardownBufferMinutes !== 999) {
			temporalScore -= 20;
			temporalStatus = "WARNING";
			temporalSummary = `Tight teardown: Only ${teardownBufferMinutes} min buffer after end before next booking "${nextSucceeding.title}".`;
			mitigations.push(`Brief organizing committee to initiate stage pack-down immediately as closing remarks finish.`);
		} else {
			temporalScore = 100;
			temporalStatus = "PASS";
			temporalSummary = `Clear calendar window. Generous buffer available before and after event for staging and sound check.`;
		}
	}

	checks.push({
		dimension: "Temporal & Operational Turnaround",
		status: temporalStatus,
		score: temporalScore,
		summary: temporalSummary,
		metric: `${durationHours}h runtime (${start} - ${end})`,
	});

	// ── Dimension 4: Campus Policy & Environmental Compliance ──
	let policyScore = 100;
	const policyFlags = [];

	// Night curfew check
	if (endMinutes > 21 * 60 + 30) {
		policyScore -= 25;
		policyFlags.push("Event extends past campus evening perimeter curfew (21:30).");
		mitigations.push("Obtain Night Extension Clearance from the Chief Warden & Dean of Student Affairs.");
	}

	// Academic Hours Noise check
	if (startMinutes < 16 * 60 + 30 && (eventType === "Cultural" || requirements.soundSystem)) {
		policyFlags.push("Event coincides with academic class hours (09:00 - 16:30). Sound pressure limit is 65 dB.");
		mitigations.push("Maintain acoustic sound governor at 65 dB or schedule high-volume speaker checks after 16:30.");
	}

	// Food / Catering in Auditorium
	const isAuditorium = /auditorium|hall\s*1|hall\s*2/i.test(plainSpace.name || "") || plainSpace.type === "Auditorium";
	if (requirements.catering && isAuditorium) {
		policyFlags.push("Food and open beverages are strictly prohibited inside the main auditorium.");
		mitigations.push("Demarcate external foyer or cafeteria lawn as the designated catering area with dedicated trash bins.");
	}

	let policyStatus = "PASS";
	let policySummary = "";
	if (policyFlags.length === 0) {
		policyStatus = "PASS";
		policySummary = "Fully compliant with campus operational policies, noise regulations, and safety codes.";
	} else if (policyScore >= 70) {
		policyStatus = "WARNING";
		policySummary = policyFlags.join(" ");
	} else {
		policyStatus = "FAIL";
		policySummary = policyFlags.join(" ");
	}

	checks.push({
		dimension: "Campus Policy & Regulatory Compliance",
		status: policyStatus,
		score: policyScore,
		summary: policySummary,
		metric: policyFlags.length === 0 ? "100% Policy Compliant" : `${policyFlags.length} Permissions Required`,
	});

	// ── Overall Feasibility Score Calculation ──
	let overallFeasibilityScore = directCollision
		? 0
		: Math.round(
			capacityScore * 0.35 +
			techScore * 0.25 +
			temporalScore * 0.25 +
			policyScore * 0.15
		);

	overallFeasibilityScore = Math.max(0, Math.min(100, overallFeasibilityScore));

	let verdict = "HIGHLY_FEASIBLE";
	let verdictLabel = "Highly Feasible";
	let verdictTone = "success";
	let executiveSummary = "";

	if (overallFeasibilityScore >= 88) {
		verdict = "HIGHLY_FEASIBLE";
		verdictLabel = "Highly Feasible";
		verdictTone = "success";
		executiveSummary = `This event is realistically primed for high operational success at ${plainSpace.name}. Capacity, infrastructure, and timeline are well-matched.`;
	} else if (overallFeasibilityScore >= 70) {
		verdict = "FEASIBLE_WITH_MITIGATIONS";
		verdictLabel = "Feasible with Mitigations";
		verdictTone = "warning";
		executiveSummary = `Viable event with minor operational constraints. Following the ${mitigations.length} suggested mitigations below will ensure smooth execution.`;
	} else if (overallFeasibilityScore >= 45) {
		verdict = "HIGH_OPERATIONAL_RISK";
		verdictLabel = "High Operational Risk";
		verdictTone = "danger";
		executiveSummary = `Significant operational friction identified (crowding, missing technical assets, or tight turnover). Major adjustments recommended.`;
	} else {
		verdict = "INVIABLE";
		verdictLabel = "Infeasible Execution";
		verdictTone = "danger";
		executiveSummary = `Critical bottleneck detected (direct schedule clash or extreme capacity deficit). Event cannot realistically be conducted under current parameters.`;
	}

	// ── Matched Requirements & Warnings Evaluation ──
	const matchedRequirements = [];
	const warnings = [];
	const missingRequirements = [];

	if (capacityMatch === true) {
		matchedRequirements.push(plainSpace.capacity ? `Capacity suitable (${participants} / ${plainSpace.capacity} Pax)` : "Capacity aligns with flexible campus layout");
	} else if (capacityMatch === "unknown") {
		matchedRequirements.push("Capacity suitable (Flexible institutional facility)");
	} else {
		missingRequirements.push(`Requires ${participants} capacity, venue supports ${plainSpace.capacity}`);
	}

	// Facility requirements checks
	const checkFacilityMatch = (flag, label, keywords, warnIfMissing = false) => {
		if (flag) {
			const hasIt = spaceFacilities.some((sf) => keywords.some((kw) => sf.includes(kw)));
			if (hasIt) {
				matchedRequirements.push(`${label} available`);
			} else {
				if (warnIfMissing) {
					warnings.push(`${label} should be verified or arranged`);
				} else {
					missingRequirements.push(`${label} not listed in venue specifications`);
				}
			}
		}
	};

	checkFacilityMatch(requirements.projector || requirements.presentation, "Projector", ["projector", "presentation", "visual"]);
	checkFacilityMatch(requirements.audioSystem || requirements.soundSystem, "Audio system", ["sound", "audio", "speaker"]);
	checkFacilityMatch(requirements.microphone, "Microphone", ["mic", "sound", "audio"]);
	checkFacilityMatch(requirements.wifi, "Wi-Fi", ["wifi", "internet", "lan"]);
	checkFacilityMatch(requirements.ac || requirements.airConditioning, "Air Conditioning", ["condition", "climate", "ac"]);
	checkFacilityMatch(requirements.stage, "Stage", ["stage", "podium"]);
	checkFacilityMatch(requirements.computers, "Computer lab / systems", ["computer", "pc", "lab"]);
	checkFacilityMatch(requirements.parking, "Parking capacity", ["parking", "valet"], true);
	checkFacilityMatch(requirements.technicalSupport, "Technical support", ["support", "tech", "staff"], true);
	checkFacilityMatch(requirements.powerBackup, "Power backup", ["power", "backup", "generator", "ups"]);

	// Add default matches if no specific requirements checked
	if (matchedRequirements.length === 1) {
		if (spaceFacilities.some((f) => f.includes("projector") || f.includes("visual"))) matchedRequirements.push("Projector & Presentation setup available");
		if (spaceFacilities.some((f) => f.includes("audio") || f.includes("sound"))) matchedRequirements.push("Audio & acoustic system available");
		if (spaceFacilities.some((f) => f.includes("wifi"))) matchedRequirements.push("Wi-Fi infrastructure available");
	}

	// Scheduling availability
	if (!directCollision) {
		matchedRequirements.push("Venue available at requested time");
	} else {
		missingRequirements.push(`Time slot collision with booking "${directCollision.title}"`);
	}

	// Parking check warning for larger events
	if (participants >= 150 && !spaceFacilities.some((f) => f.includes("parking"))) {
		warnings.push("Parking capacity should be verified for 150+ attendees");
	}

	// ── Alternative Venues Discovery ──
	let alternativeVenues = [];
	try {
		const otherSpaces = await Space.find({
			_id: { $ne: plainSpace.id || plainSpace._id },
			status: "active",
		});

		const busySpaces = new Set();
		const conflictsOnDate = await Booking.find({
			date,
			status: { $in: ["Approved", "Pending", "Confirmed"] },
			start: { $lt: end },
			end: { $gt: start },
		});
		conflictsOnDate.forEach((c) => busySpaces.add(String(c.spaceId)));

		alternativeVenues = otherSpaces
			.filter((s) => !busySpaces.has(String(s._id)))
			.map((s) => {
				const splain = s.toObject ? s.toObject() : s;
				const score = calculateRecommendationScore(splain, {
					capacity: participants,
					facilities: plainSpace.facilities,
				});
				return {
					id: splain.id || splain._id,
					name: splain.name,
					type: splain.type,
					capacity: splain.capacity,
					facilities: splain.facilities,
					accessType: "Free Institutional Use",
					isVerified: splain.isVerified,
					score: score.overallScore,
					explanation: score.explanation,
				};
			})
			.sort((a, b) => b.score - a.score)
			.slice(0, 3);
	} catch (altErr) {
		console.error("Error discovering alternative venues:", altErr);
	}

	return {
		space: {
			id: plainSpace.id || plainSpace._id,
			name: plainSpace.name,
			type: plainSpace.type,
			capacity: plainSpace.capacity,
			facilities: plainSpace.facilities,
			accessType: "Free Institutional Use",
			isVerified: plainSpace.isVerified,
			sourceName: plainSpace.sourceName,
			sourceUrl: plainSpace.sourceUrl,
		},
		recommendedVenue: {
			id: plainSpace.id || plainSpace._id,
			name: plainSpace.name,
			type: plainSpace.type,
			capacity: plainSpace.capacity,
			facilities: plainSpace.facilities,
			isVerified: plainSpace.isVerified,
			reasons: matchedRequirements,
		},
		eventParams: {
			eventName: eventDetails.eventName || eventDetails.title || `${eventType} Event`,
			eventType,
			participants,
			date,
			start,
			end,
			durationHours,
			department: eventDetails.department || eventDetails.organizedBy || "Academic Department",
			requirements,
		},
		overallFeasibilityScore,
		verdict,
		verdictLabel: `${overallFeasibilityScore}% Feasible`,
		verdictTone,
		executiveSummary,
		matchedRequirements,
		warnings,
		missingRequirements,
		alternativeVenues,
		dimensions: checks,
		actionableMitigations: mitigations,
		isBookable: overallFeasibilityScore >= 50 && !directCollision,
	};
};

module.exports = {
	parseNaturalQuery,
	calculateRecommendationScore,
	getEventPlan,
	estimateEventCost,
	estimateEventLogistics,
	calculateUtilizationAnalytics,
	calculateEventFeasibility,
};

