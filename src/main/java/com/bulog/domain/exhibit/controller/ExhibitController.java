package com.bulog.domain.exhibit.controller;

import com.bulog.domain.exhibit.dto.res.ExhibitResponseDTO;
import com.bulog.domain.exhibit.exception.code.ExhibitSuccessCode;
import com.bulog.domain.exhibit.service.ExhibitService;
import com.bulog.global.apiPayload.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/exhibits")
@RequiredArgsConstructor
public class ExhibitController {

    private final ExhibitService exhibitService;

    @GetMapping("/{exhibitId}")
    public ApiResponse<ExhibitResponseDTO> getExhibit(@PathVariable String exhibitId) {
        return ApiResponse.of(
                ExhibitSuccessCode.EXHIBIT_FOUND,
                exhibitService.getExhibit(exhibitId)
        );
    }
}
