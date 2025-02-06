import Party from "../classes/models/party.class";
import { partySessions } from "./sessions";

export const createPartySession = (id, partyName) => {
    const partySession = new Party(id, partyName);
    partySessions.push(partySession);
    return partySession;
}
