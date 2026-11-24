package com.bulog.domain.halloffame.entity;

/** 실시간 기록의 종류 */
public enum HallRecordType {
    /** 유물을 모아 그림 한 칸을 채움 */
    FILL,
    /** 한 전시실의 그림을 모두 채움 */
    ROOM_DONE,
    /** 모든 전시실을 완주함 */
    FINISH
}
