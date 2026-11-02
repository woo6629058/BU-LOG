package com.bulog.domain.card.repository;

import com.bulog.domain.card.entity.CardCollection;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CardCollectionRepository
        extends JpaRepository<CardCollection, Long>, CardCollectionStore {

    @Override
    default CardCollection store(CardCollection cardCollection) {
        return save(cardCollection);
    }
}
