package com.bulog.domain.collection.controller;

import com.bulog.domain.collection.dto.res.ArchiveResponseDTO;
import com.bulog.domain.collection.dto.res.CollectionRecordResponseDTO;
import com.bulog.domain.collection.exception.code.CollectionSuccessCode;
import com.bulog.domain.collection.service.CollectionService;
import com.bulog.domain.visitor.entity.Visitor;
import com.bulog.domain.visitor.service.VisitorRequestFilter;
import com.bulog.global.apiPayload.ApiResponse;
import com.bulog.global.security.MemberPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class CollectionController {

    private final CollectionService collectionService;

    @GetMapping("/archive")
    public ApiResponse<ArchiveResponseDTO> getArchive(
            @RequestAttribute(VisitorRequestFilter.VISITOR_ATTRIBUTE) Visitor visitor,
            @AuthenticationPrincipal MemberPrincipal principal
    ) {
        return ApiResponse.of(
                CollectionSuccessCode.ARCHIVE_FOUND,
                collectionService.getArchive(visitor, memberId(principal))
        );
    }

    @GetMapping("/collections/{recordId}")
    public ApiResponse<CollectionRecordResponseDTO> getRecord(
            @PathVariable Long recordId,
            @RequestAttribute(VisitorRequestFilter.VISITOR_ATTRIBUTE) Visitor visitor,
            @AuthenticationPrincipal MemberPrincipal principal
    ) {
        return ApiResponse.of(
                CollectionSuccessCode.RECORD_FOUND,
                collectionService.getRecord(recordId, visitor, memberId(principal))
        );
    }

    private Long memberId(MemberPrincipal principal) {
        return principal == null ? null : principal.memberId();
    }
}
