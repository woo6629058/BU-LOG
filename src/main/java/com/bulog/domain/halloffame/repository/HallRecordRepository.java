package com.bulog.domain.halloffame.repository;

import com.bulog.domain.halloffame.entity.HallRecord;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HallRecordRepository extends JpaRepository<HallRecord, Long>, HallRecordStore {

    @Override
    default HallRecord store(HallRecord hallRecord) {
        return save(hallRecord);
    }
}
