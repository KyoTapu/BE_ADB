import { roomService } from "./room.service.js";

export const getRoomStatus = async (req, res, next) => {
  try {
    const data = await roomService.getStatus();
    res.json(data);
  } catch (error) {
    next(error);
  }
};
