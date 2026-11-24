package com.bulog.domain.collection.repository;

import com.bulog.domain.collection.entity.CollectionRecord;
import com.bulog.domain.visitor.repository.VisitorStore;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

/**
 * DB 없이 켜는 local 프로필용 수집 기록 저장소. 서버를 다시 켜면 처음 상태로 돌아간다.
 * 기본은 운영처럼 빈 상태로 시작하고, BULOG_SAMPLE_DATA=true로 켜면 방문자마다 샘플 수집 기록 7개를 미리 넣는다
 * (일부가 채워진 그림 도감·진열장을 바로 볼 때).
 */
@Repository
@Profile("local")
public class LocalCollectionRecordRepository implements CollectionRecordStore {

    static final List<String> SAMPLE_EXHIBIT_IDS = List.of(
            "ongi1-faith-jar",
            "ongi1-jubyeong",
            "ongi1-seongju-danji",
            "ongi2-kongnamul-siru",
            "ongi2-pattern-jar",
            "ongi2-sojutgori",
            "local-half-moon-knife"
    );

    private final AtomicLong sequence = new AtomicLong();
    private final Map<Long, CollectionRecord> records = new ConcurrentHashMap<>();
    private final Set<Long> seededVisitorIds = ConcurrentHashMap.newKeySet();
    // null이면 샘플 수집 기록을 넣지 않는다.
    private final VisitorStore visitorStore;

    public LocalCollectionRecordRepository() {
        this(null);
    }

    public LocalCollectionRecordRepository(VisitorStore visitorStore) {
        this.visitorStore = visitorStore;
    }

    @Autowired
    public LocalCollectionRecordRepository(
            VisitorStore visitorStore,
            @Value("${app.local.sample-data:false}") boolean sampleData
    ) {
        this(sampleData ? visitorStore : null);
    }

    @Override
    public CollectionRecord store(CollectionRecord collectionRecord) {
        CollectionRecord storedRecord = collectionRecord.getId() == null
                ? CollectionRecord.create(
                        sequence.incrementAndGet(),
                        collectionRecord.getVisitor(),
                        collectionRecord.getExhibitId(),
                        collectionRecord.getAcquiredAt()
                )
                : collectionRecord;
        records.put(storedRecord.getId(), storedRecord);
        return storedRecord;
    }

    @Override
    public Optional<CollectionRecord> findById(Long recordId) {
        return Optional.ofNullable(records.get(recordId));
    }

    @Override
    public Optional<CollectionRecord> findByVisitor_IdAndExhibitId(
            Long visitorId,
            String exhibitId
    ) {
        seedSampleRecords(visitorId);
        return records.values().stream()
                .filter(collected -> collected.getVisitor().getId().equals(visitorId))
                .filter(collected -> collected.getExhibitId().equals(exhibitId))
                .findFirst();
    }

    @Override
    public List<CollectionRecord> findAllByVisitor_IdIn(Collection<Long> visitorIds) {
        visitorIds.forEach(this::seedSampleRecords);
        return records.values().stream()
                .filter(collected -> visitorIds.contains(collected.getVisitor().getId()))
                .toList();
    }

    // 방문자를 처음 볼 때 한 번만 샘플 수집 기록을 넣는다. 획득 시각은 5분 간격으로 둔다.
    private void seedSampleRecords(Long visitorId) {
        if (visitorStore == null || visitorId == null || !seededVisitorIds.add(visitorId)) {
            return;
        }
        visitorStore.findByIdForUpdate(visitorId).ifPresent(visitor -> {
            LocalDateTime firstAcquiredAt = LocalDateTime.now()
                    .withNano(0)
                    .minusMinutes(5L * SAMPLE_EXHIBIT_IDS.size());
            for (int index = 0; index < SAMPLE_EXHIBIT_IDS.size(); index++) {
                store(CollectionRecord.create(
                        null,
                        visitor,
                        SAMPLE_EXHIBIT_IDS.get(index),
                        firstAcquiredAt.plusMinutes(5L * index)
                ));
            }
        });
    }
}
