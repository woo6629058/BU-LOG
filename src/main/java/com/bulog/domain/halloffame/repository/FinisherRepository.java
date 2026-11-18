package com.bulog.domain.halloffame.repository;

import com.bulog.domain.halloffame.entity.Finisher;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FinisherRepository extends JpaRepository<Finisher, Long>, FinisherStore {

    @Override
    default Finisher store(Finisher finisher) {
        return save(finisher);
    }

    // 이름(닉네임)을 보여 주려고 방문자·회원을 한 번에 같이 읽는다 (완주자마다 따로 조회하지 않게)
    @Override
    @EntityGraph(attributePaths = {"visitor", "visitor.member"})
    List<Finisher> findTop20ByOrderByIdDesc();
}
