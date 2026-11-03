package com.bulog.domain.card.repository;

import com.bulog.domain.card.entity.CardCollection;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CardCollectionStore {

    CardCollection store(CardCollection cardCollection);

    Optional<CardCollection> findById(Long cardId);

    Optional<CardCollection> findByVisitor_IdAndExhibitId(Long visitorId, String exhibitId);

    List<CardCollection> findAllByVisitor_IdIn(Collection<Long> visitorIds);
}
