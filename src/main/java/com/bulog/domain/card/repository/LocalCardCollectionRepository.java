package com.bulog.domain.card.repository;

import com.bulog.domain.card.entity.CardCollection;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Repository;

@Repository
@Profile("local")
public class LocalCardCollectionRepository implements CardCollectionStore {

    private final AtomicLong sequence = new AtomicLong();
    private final Map<Long, CardCollection> cardCollections = new ConcurrentHashMap<>();

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
        return cardCollections.values().stream()
                .filter(card -> card.getVisitor().getId().equals(visitorId))
                .filter(card -> card.getExhibitId().equals(exhibitId))
                .findFirst();
    }

    @Override
    public List<CardCollection> findAllByVisitor_IdIn(Collection<Long> visitorIds) {
        return cardCollections.values().stream()
                .filter(card -> visitorIds.contains(card.getVisitor().getId()))
                .toList();
    }
}
