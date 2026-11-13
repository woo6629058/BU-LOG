package com.bulog.domain.card.repository;

import com.bulog.domain.card.entity.CardCollection;
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
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

/**
 * DB 없이 켜는 local 프로필용 카드 저장소.
 * 서버로 켜면 방문자마다 샘플 카드 7장을 미리 넣어, 일부가 채워진 그림 도감·진열장을 바로 볼 수 있게 한다.
 * 서버를 다시 켜면 처음 상태로 돌아간다.
 */
@Repository
@Profile("local")
public class LocalCardCollectionRepository implements CardCollectionStore {

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
    private final Map<Long, CardCollection> cardCollections = new ConcurrentHashMap<>();
    private final Set<Long> seededVisitorIds = ConcurrentHashMap.newKeySet();
    // null이면 샘플 카드를 넣지 않는다 (테스트에서 빈 저장소로 쓸 때).
    private final VisitorStore visitorStore;

    public LocalCardCollectionRepository() {
        this(null);
    }

    @Autowired
    public LocalCardCollectionRepository(VisitorStore visitorStore) {
        this.visitorStore = visitorStore;
    }

    @Override
    public CardCollection store(CardCollection cardCollection) {
        CardCollection storedCard = cardCollection.getId() == null
                ? CardCollection.create(
                        sequence.incrementAndGet(),
                        cardCollection.getVisitor(),
                        cardCollection.getExhibitId(),
                        cardCollection.getAcquiredAt()
                )
                : cardCollection;
        cardCollections.put(storedCard.getId(), storedCard);
        return storedCard;
    }

    @Override
    public Optional<CardCollection> findById(Long cardId) {
        return Optional.ofNullable(cardCollections.get(cardId));
    }

    @Override
    public Optional<CardCollection> findByVisitor_IdAndExhibitId(
            Long visitorId,
            String exhibitId
    ) {
        seedSampleCards(visitorId);
        return cardCollections.values().stream()
                .filter(card -> card.getVisitor().getId().equals(visitorId))
                .filter(card -> card.getExhibitId().equals(exhibitId))
                .findFirst();
    }

    @Override
    public List<CardCollection> findAllByVisitor_IdIn(Collection<Long> visitorIds) {
        visitorIds.forEach(this::seedSampleCards);
        return cardCollections.values().stream()
                .filter(card -> visitorIds.contains(card.getVisitor().getId()))
                .toList();
    }

    // 방문자를 처음 볼 때 한 번만 샘플 카드를 넣는다. 획득 시각은 5분 간격으로 둔다.
    private void seedSampleCards(Long visitorId) {
        if (visitorStore == null || visitorId == null || !seededVisitorIds.add(visitorId)) {
            return;
        }
        visitorStore.findByIdForUpdate(visitorId).ifPresent(visitor -> {
            LocalDateTime firstAcquiredAt = LocalDateTime.now()
                    .withNano(0)
                    .minusMinutes(5L * SAMPLE_EXHIBIT_IDS.size());
            for (int index = 0; index < SAMPLE_EXHIBIT_IDS.size(); index++) {
                store(CardCollection.create(
                        null,
                        visitor,
                        SAMPLE_EXHIBIT_IDS.get(index),
                        firstAcquiredAt.plusMinutes(5L * index)
                ));
            }
        });
    }
}
