package com.bulog.domain.halloffame.repository;

import com.bulog.domain.halloffame.entity.HallRecord;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

@Repository
@Profile("local")
public class LocalHallRecordRepository implements HallRecordStore {

    private final AtomicLong sequence = new AtomicLong();
    private final Map<Long, HallRecord> records = new ConcurrentHashMap<>();

    @Override
    public HallRecord store(HallRecord hallRecord) {
        HallRecord stored = hallRecord.getId() == null
                ? hallRecord.withId(sequence.incrementAndGet())
                : hallRecord;
        records.put(stored.getId(), stored);
        return stored;
    }

    @Override
    public List<HallRecord> findTop30ByOrderByIdDesc() {
        return records.values().stream()
                .sorted(Comparator.comparing(HallRecord::getId).reversed())
                .limit(30)
                .toList();
    }
}
