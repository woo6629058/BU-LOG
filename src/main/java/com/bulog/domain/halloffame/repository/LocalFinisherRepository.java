package com.bulog.domain.halloffame.repository;

import com.bulog.domain.halloffame.entity.Finisher;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

@Repository
@Profile("local")
public class LocalFinisherRepository implements FinisherStore {

    private final AtomicLong sequence = new AtomicLong();
    private final Map<Long, Finisher> finishers = new ConcurrentHashMap<>();

    @Override
    public Finisher store(Finisher finisher) {
        Finisher stored = finisher.getId() == null
                ? Finisher.create(
                        sequence.incrementAndGet(),
                        finisher.getVisitor(),
                        finisher.getStartedAt(),
                        finisher.getFinishedAt()
                )
                : finisher;
        finishers.put(stored.getId(), stored);
        return stored;
    }

    @Override
    public Optional<Finisher> findById(Long finisherNo) {
        return Optional.ofNullable(finishers.get(finisherNo));
    }

    @Override
    public List<Finisher> findTop20ByOrderByIdDesc() {
        return finishers.values().stream()
                .sorted(Comparator.comparing(Finisher::getId).reversed())
                .limit(20)
                .toList();
    }

    @Override
    public long count() {
        return finishers.size();
    }

    @Override
    public long countByFinishedAtGreaterThanEqual(LocalDateTime from) {
        return finishers.values().stream()
                .filter(finisher -> !finisher.getFinishedAt().isBefore(from))
                .count();
    }

    @Override
    public Optional<Finisher> findFirstByVisitor_IdInOrderByIdAsc(Collection<Long> visitorIds) {
        return finishers.values().stream()
                .filter(finisher -> visitorIds.contains(finisher.getVisitor().getId()))
                .min(Comparator.comparing(Finisher::getId));
    }
}
