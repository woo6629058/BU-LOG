package com.bulog.domain.halloffame.repository;

import com.bulog.domain.halloffame.entity.Finisher;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface FinisherStore {

    Finisher store(Finisher finisher);

    Optional<Finisher> findById(Long finisherNo);

    /** 최근에 완주한 순서로 20명 */
    List<Finisher> findTop20ByOrderByIdDesc();

    long count();

    long countByFinishedAtGreaterThanEqual(LocalDateTime from);

    /** 이 방문자들(같은 사람) 중 이미 완주한 기록 */
    Optional<Finisher> findFirstByVisitor_IdInOrderByIdAsc(Collection<Long> visitorIds);
}
