package com.bulog.domain.collection.repository;

import com.bulog.domain.collection.entity.CollectionRecord;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface CollectionRecordStore {

    CollectionRecord store(CollectionRecord collectionRecord);

    Optional<CollectionRecord> findById(Long recordId);

    Optional<CollectionRecord> findByVisitor_IdAndExhibitId(Long visitorId, String exhibitId);

    List<CollectionRecord> findAllByVisitor_IdIn(Collection<Long> visitorIds);
}
