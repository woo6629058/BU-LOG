package com.bulog.domain.halloffame.repository;

import com.bulog.domain.halloffame.entity.HallRecord;
import java.util.List;

public interface HallRecordStore {

    HallRecord store(HallRecord hallRecord);

    /** 최근 기록 30개 (최근 순서) */
    List<HallRecord> findTop30ByOrderByIdDesc();
}
