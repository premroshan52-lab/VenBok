import api from "./api";

/**
 * Service to interact with the SPACIO Event Feasibility Engine.
 */
export const checkEventFeasibility = async (payload) => {
  const response = await api.post("/intelligence/feasibility", payload);
  return response.data?.data;
};

export const getEventPlanTemplate = async (eventType, participants) => {
  const response = await api.get("/intelligence/event-plan", {
    params: { eventType, participants },
  });
  return response.data?.data;
};
