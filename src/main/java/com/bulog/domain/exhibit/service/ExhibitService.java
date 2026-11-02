package com.bulog.domain.exhibit.service;

import com.bulog.domain.exhibit.converter.ExhibitConverter;
import com.bulog.domain.exhibit.dto.res.ExhibitResponseDTO;
import com.bulog.domain.exhibit.entity.Exhibit;
import com.bulog.domain.exhibit.exception.ExhibitException;
import com.bulog.domain.exhibit.exception.code.ExhibitErrorCode;
import com.bulog.domain.exhibit.repository.ExhibitRepository;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ExhibitService {

    private final ExhibitRepository exhibitRepository;

    @Transactional(readOnly = true)
    public ExhibitResponseDTO getExhibit(String exhibitId) {
        Exhibit exhibit = exhibitRepository.findById(exhibitId)
                .orElseThrow(() -> new ExhibitException(
                        ExhibitErrorCode.EXHIBIT_NOT_FOUND,
                        Map.of("exhibitId", exhibitId)
                ));

        return ExhibitConverter.toResponse(exhibit);
    }
}
