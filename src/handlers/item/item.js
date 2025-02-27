import { getUserBySocket } from "../../session/user.session.js";

export const healthPotion = (amount) => {
    return (socket, data) => {
        const user = getUserBySocket(socket);
        user.playerStatInfo.hp = Math.max(user.playerStatInfo.maxHp, user.playerStatInfo.hp + amount);
    }
}

export const heatlhPercentagePotion = (amount) => {
    return (socket, data) => {
        const user = getUserBySocket(socket);
        user.playerStatInfo.hp = Math.max(user.playerStatInfo.maxHp, user.playerStatInfo.hp + user.playerStatInfo.maxHp * amount);
    }
}