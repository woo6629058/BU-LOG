package com.bulog.domain.exhibit.controller;

import com.bulog.domain.exhibit.client.EmuseumImage;
import com.bulog.domain.exhibit.dto.res.ExhibitListResponseDTO;
import com.bulog.domain.exhibit.dto.res.ExhibitResponseDTO;
import com.bulog.domain.exhibit.exception.code.ExhibitSuccessCode;
import com.bulog.domain.exhibit.service.ExhibitService;
import com.bulog.global.apiPayload.ApiResponse;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.time.Duration;
import lombok.RequiredArgsConstructor;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/exhibits")
@RequiredArgsConstructor
@Validated
public class ExhibitController {

    private final ExhibitService exhibitService;

    @GetMapping
    public ApiResponse<ExhibitListResponseDTO> getExhibits(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String exhibitionRoom,
            @RequestParam(required = false) Boolean collectible,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size
    ) {
        return ApiResponse.of(
                ExhibitSuccessCode.EXHIBIT_LIST_FOUND,
                exhibitService.getExhibits(
                        keyword,
                        exhibitionRoom,
                        collectible,
                        page,
                        size
                )
        );
    }

    @GetMapping("/{exhibitId}/image")
    public ResponseEntity<byte[]> getExhibitImage(@PathVariable String exhibitId) {
        EmuseumImage image = exhibitService.getExhibitImage(exhibitId);
        return ResponseEntity.ok()
                .contentType(image.contentType())
                .cacheControl(CacheControl.maxAge(Duration.ofDays(7)).cachePublic())
                .body(image.content());
    }

    @GetMapping("/{exhibitId}")
    public ApiResponse<ExhibitResponseDTO> getExhibit(@PathVariable String exhibitId) {
        return ApiResponse.of(
                ExhibitSuccessCode.EXHIBIT_FOUND,
                exhibitService.getExhibit(exhibitId)
        );
    }
}
