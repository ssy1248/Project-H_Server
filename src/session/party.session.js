import Party from "../classes/models/party.class.js";
import { partySessions } from "./sessions.js";

// 파티 생성
export const createPartySession = (id, partyName) => {
    const partySession = new Party(id, partyName);
    partySessions.push(partySession);
    return partySession;
}

// 파티 해체
export const removePartySession = (id) => {

}

// 파티 조회?

// 파티 참여여