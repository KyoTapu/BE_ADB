import { roomRepository } from "./room.repository.js";
import { toRoomResponse } from "./room.model.js";

class RoomService {
  async getStatus() {
    const record = await roomRepository.getStatus();
    return toRoomResponse(record);
  }
}

export const roomService = new RoomService();
