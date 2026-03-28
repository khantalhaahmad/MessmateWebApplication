import DeliveryAgent from "../models/DeliveryAgent.js";

export const assignOrderToAgent = async (order, io) => {
  const agents = await DeliveryAgent.find({
    isOnline: true,
    isAvailable: true
  });

  if (!agents.length) return;

  const agent = agents[0]; // later nearest logic


  order.agentId = agent._id;
  order.deliveryStatus = "ASSIGNED";

  await order.save();

  io.to(`agent_${agent._id}`).emit("new-order", order);
};