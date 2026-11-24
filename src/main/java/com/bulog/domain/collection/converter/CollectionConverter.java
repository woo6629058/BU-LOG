package com.bulog.domain.collection.converter;

import com.bulog.domain.collection.dto.res.ArchiveItemResponseDTO;
import com.bulog.domain.collection.dto.res.CollectionAcquisitionResponseDTO;
import com.bulog.domain.collection.dto.res.CollectionRecordResponseDTO;
import com.bulog.domain.collection.entity.CollectionRecord;
import com.bulog.domain.exhibit.entity.Exhibit;

public final class CollectionConverter {

    private CollectionConverter() {
    }

    public static CollectionAcquisitionResponseDTO toAcquisitionResponse(
            CollectionRecord collected,
            boolean newlyAcquired
    ) {
        return new CollectionAcquisitionResponseDTO(
                collected.getId(),
                collected.getExhibitId(),
                newlyAcquired
        );
    }

    public static ArchiveItemResponseDTO toArchiveResponse(
            Exhibit exhibit,
            CollectionRecord collected
    ) {
        return new ArchiveItemResponseDTO(
                collected == null ? null : collected.getId(),
                exhibit.getId(),
                exhibit.getName(),
                exhibit.getEra(),
                exhibit.getDescription(),
                exhibit.getImageUrl(),
                exhibit.getExhibitionRoom(),
                exhibit.getExhibitNumber(),
                collected != null,
                collected == null ? null : collected.getAcquiredAt()
        );
    }

    public static CollectionRecordResponseDTO toDetailResponse(
            CollectionRecord collected,
            Exhibit exhibit
    ) {
        return new CollectionRecordResponseDTO(
                collected.getId(),
                exhibit.getId(),
                exhibit.getName(),
                exhibit.getEra(),
                exhibit.getDescription(),
                exhibit.getImageUrl(),
                collected.getAcquiredAt()
        );
    }
}
