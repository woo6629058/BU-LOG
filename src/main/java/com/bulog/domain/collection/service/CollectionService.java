package com.bulog.domain.collection.service;

import com.bulog.domain.collection.converter.CollectionConverter;
import com.bulog.domain.collection.dto.res.ArchiveItemResponseDTO;
import com.bulog.domain.collection.dto.res.ArchiveResponseDTO;
import com.bulog.domain.collection.dto.res.CollectionAcquisitionResponseDTO;
import com.bulog.domain.collection.dto.res.CollectionRecordResponseDTO;
import com.bulog.domain.collection.entity.CollectionRecord;
import com.bulog.domain.collection.exception.CollectionException;
import com.bulog.domain.collection.exception.code.CollectionErrorCode;
import com.bulog.domain.collection.repository.CollectionRecordStore;
import com.bulog.domain.exhibit.entity.Exhibit;
import com.bulog.domain.exhibit.repository.ExhibitCatalog;
import com.bulog.domain.halloffame.service.HallOfFameService;
import com.bulog.domain.visitor.entity.Visitor;
import com.bulog.domain.visitor.service.VisitorService;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CollectionService {

    private final CollectionRecordStore collectionRecordStore;
    private final ExhibitCatalog exhibitCatalog;
    private final VisitorService visitorService;
    private final HallOfFameService hallOfFameService;

    @Transactional
    public CollectionAcquisitionResponseDTO collect(
            Visitor visitor,
            Long authenticatedMemberId,
            String exhibitId
    ) {
        Visitor lockedVisitor = visitorService.lockVisitor(visitor.getId());
        List<Long> ownerVisitorIds = visitorService.getVisitorIds(
                lockedVisitor,
                authenticatedMemberId
        );
        List<CollectionRecord> ownerRecords = collectionRecordStore.findAllByVisitor_IdIn(ownerVisitorIds);
        CollectionRecord existingRecord = ownerRecords.stream()
                .filter(collected -> collected.getExhibitId().equals(exhibitId))
                .min(Comparator.comparing(CollectionRecord::getAcquiredAt))
                .orElse(null);

        if (existingRecord != null) {
            return CollectionConverter.toAcquisitionResponse(existingRecord, false);
        }

        CollectionRecord newRecord = collectionRecordStore.store(CollectionRecord.create(
                null,
                lockedVisitor,
                exhibitId,
                LocalDateTime.now()
        ));
        hallOfFameService.recordNewCollection(lockedVisitor, ownerVisitorIds, ownerRecords, newRecord);
        return CollectionConverter.toAcquisitionResponse(newRecord, true);
    }

    /** 로그인으로 방문자 기록이 합쳐진 뒤 호출: 합친 기록으로 완주했으면 완주 번호를 준다. */
    @Transactional
    public void syncFinisher(Visitor visitor, Long memberId) {
        Visitor lockedVisitor = visitorService.lockVisitor(visitor.getId());
        List<Long> ownerVisitorIds = visitorService.getVisitorIds(lockedVisitor, memberId);
        hallOfFameService.finishIfComplete(
                lockedVisitor,
                ownerVisitorIds,
                collectionRecordStore.findAllByVisitor_IdIn(ownerVisitorIds)
        );
    }

    @Transactional(readOnly = true)
    public ArchiveResponseDTO getArchive(Visitor visitor, Long authenticatedMemberId) {
        List<Long> ownerVisitorIds = visitorService.getVisitorIds(
                visitor,
                authenticatedMemberId
        );
        Map<String, CollectionRecord> acquiredRecords = collectionRecordStore
                .findAllByVisitor_IdIn(ownerVisitorIds)
                .stream()
                .collect(Collectors.toMap(
                        CollectionRecord::getExhibitId,
                        Function.identity(),
                        CollectionService::earlierRecord,
                        LinkedHashMap::new
                ));

        List<Exhibit> exhibits = exhibitCatalog.findAllCollectible();
        List<ArchiveItemResponseDTO> archiveItems = exhibits.stream()
                .map(exhibit -> CollectionConverter.toArchiveResponse(
                        exhibit,
                        acquiredRecords.get(exhibit.getId())
                ))
                .toList();
        return new ArchiveResponseDTO(
                archiveItems.stream().filter(ArchiveItemResponseDTO::acquired).count(),
                exhibits.size(),
                archiveItems
        );
    }

    @Transactional(readOnly = true)
    public CollectionRecordResponseDTO getRecord(
            Long recordId,
            Visitor visitor,
            Long authenticatedMemberId
    ) {
        List<Long> ownerVisitorIds = visitorService.getVisitorIds(
                visitor,
                authenticatedMemberId
        );
        CollectionRecord collected = collectionRecordStore.findById(recordId)
                .filter(found -> ownerVisitorIds.contains(found.getVisitor().getId()))
                .orElseThrow(() -> new CollectionException(
                        CollectionErrorCode.RECORD_NOT_FOUND,
                        Map.of("recordId", recordId)
                ));
        Exhibit exhibit = exhibitCatalog.findById(collected.getExhibitId())
                .orElseThrow(() -> new CollectionException(
                        CollectionErrorCode.RECORD_NOT_FOUND,
                        Map.of("recordId", recordId)
                ));
        return CollectionConverter.toDetailResponse(collected, exhibit);
    }

    private static CollectionRecord earlierRecord(CollectionRecord first, CollectionRecord second) {
        return first.getAcquiredAt().isBefore(second.getAcquiredAt()) ? first : second;
    }
}
