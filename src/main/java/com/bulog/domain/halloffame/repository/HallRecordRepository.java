package com.bulog.domain.halloffame.repository;

import com.bulog.domain.halloffame.entity.HallRecord;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HallRecordRepository extends JpaRepository<HallRecord, Long>, HallRecordStore {

    @Override
    default HallRecord store(HallRecord hallRecord) {
        return save(hallRecord);
    }

    // 이름과 완주 번호를 보여 주려고 방문자·회원·완주 기록을 한 번에 같이 읽는다 (기록마다 따로 조회하지 않게)
    @Override
    @EntityGraph(attributePaths = {"visitor", "visitor.member", "finisher"})
    List<HallRecord> findTop30ByOrderByIdDesc();
}
