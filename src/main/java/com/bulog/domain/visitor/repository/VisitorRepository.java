package com.bulog.domain.visitor.repository;

import com.bulog.domain.visitor.entity.Visitor;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface VisitorRepository extends JpaRepository<Visitor, Long>, VisitorStore {

    @Override
    default Visitor store(Visitor visitor) {
        return save(visitor);
    }

    @Override
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select visitor from Visitor visitor where visitor.id = :visitorId")
    Optional<Visitor> findByIdForUpdate(@Param("visitorId") Long visitorId);
}
