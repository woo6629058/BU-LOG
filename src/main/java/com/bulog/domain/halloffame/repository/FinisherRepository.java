package com.bulog.domain.halloffame.repository;

import com.bulog.domain.halloffame.entity.Finisher;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FinisherRepository extends JpaRepository<Finisher, Long>, FinisherStore {

    @Override
    default Finisher store(Finisher finisher) {
        return save(finisher);
    }
}
