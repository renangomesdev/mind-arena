package com.mindarena.dto;

public class GameEventDTO {
    private String type; // PLAYER_JOINED, GAME_STARTED, QUESTION_STARTED, QUESTION_ENDED, FINISHED
    private Object payload;

    public GameEventDTO() {}
    public GameEventDTO(String type, Object payload) {
        this.type = type;
        this.payload = payload;
    }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public Object getPayload() { return payload; }
    public void setPayload(Object payload) { this.payload = payload; }
}
