package com.bulog.domain.collection.repository;

import com.bulog.domain.collection.entity.CollectionRecord;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CollectionRecordRepository
        extends JpaRepository<CollectionRecord, Long>, CollectionRecordStore {

    @Override
    default CollectionRecord store(CollectionRecord collectionRecord) {
        return save(collectionRecord);
    }
}
