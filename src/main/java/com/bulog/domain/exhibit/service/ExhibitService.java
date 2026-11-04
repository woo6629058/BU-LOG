package com.bulog.domain.exhibit.service;

import com.bulog.domain.exhibit.client.EmuseumClient;
import com.bulog.domain.exhibit.client.EmuseumImage;
import com.bulog.domain.exhibit.converter.ExhibitConverter;
import com.bulog.domain.exhibit.dto.res.ExhibitListResponseDTO;
import com.bulog.domain.exhibit.dto.res.ExhibitResponseDTO;
import com.bulog.domain.exhibit.entity.Exhibit;
import com.bulog.domain.exhibit.exception.ExhibitException;
import com.bulog.domain.exhibit.exception.code.ExhibitErrorCode;
import com.bulog.domain.exhibit.repository.ExhibitCatalog;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ExhibitService {

    private final ExhibitCatalog exhibitCatalog;
    private final EmuseumClient emuseumClient;

    @Transactional(readOnly = true)
    public ExhibitResponseDTO getExhibit(String exhibitId) {
        Exhibit exhibit = getRequiredExhibit(exhibitId);

        return ExhibitConverter.toResponse(exhibit);
    }

    @Transactional(readOnly = true)
    public ExhibitListResponseDTO getExhibits(
            String keyword,
            String exhibitionRoom,
            Boolean collectible,
            int page,
            int size
    ) {
        PageRequest pageable = PageRequest.of(
                page,
                size,
                Sort.by(Sort.Order.asc("visitOrder"), Sort.Order.asc("name"))
        );
        return ExhibitConverter.toListResponse(exhibitCatalog.search(
                normalize(keyword),
                normalize(exhibitionRoom),
                collectible,
                pageable
        ));
    }

    public EmuseumImage getExhibitImage(String exhibitId) {
        Exhibit exhibit = getRequiredExhibit(exhibitId);
        if (exhibit.getExternalImageUrl() == null) {
            throw new ExhibitException(
                    ExhibitErrorCode.EXHIBIT_IMAGE_NOT_FOUND,
                    Map.of("exhibitId", exhibitId)
            );
        }
        return emuseumClient.getImage(exhibit.getExternalImageUrl());
    }

    private Exhibit getRequiredExhibit(String exhibitId) {
        return exhibitCatalog.findById(exhibitId)
                .orElseThrow(() -> new ExhibitException(
                        ExhibitErrorCode.EXHIBIT_NOT_FOUND,
                        Map.of("exhibitId", exhibitId)
                ));
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
