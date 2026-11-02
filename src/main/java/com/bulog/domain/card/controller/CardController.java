package com.bulog.domain.card.controller;

import com.bulog.domain.card.dto.res.ArchiveResponseDTO;
import com.bulog.domain.card.dto.res.CardDetailResponseDTO;
import com.bulog.domain.card.exception.code.CardSuccessCode;
import com.bulog.domain.card.service.CardService;
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
public class CardController {

    private final CardService cardService;

    @GetMapping("/archive")
    public ApiResponse<ArchiveResponseDTO> getArchive(
            @RequestAttribute(VisitorRequestFilter.VISITOR_ATTRIBUTE) Visitor visitor,
            @AuthenticationPrincipal MemberPrincipal principal
    ) {
        return ApiResponse.of(
                CardSuccessCode.ARCHIVE_FOUND,
                cardService.getArchive(visitor, memberId(principal))
        );
    }

    @GetMapping("/cards/{cardId}")
    public ApiResponse<CardDetailResponseDTO> getCard(
            @PathVariable Long cardId,
            @RequestAttribute(VisitorRequestFilter.VISITOR_ATTRIBUTE) Visitor visitor,
            @AuthenticationPrincipal MemberPrincipal principal
    ) {
        return ApiResponse.of(
                CardSuccessCode.CARD_FOUND,
                cardService.getCard(cardId, visitor, memberId(principal))
        );
    }

    private Long memberId(MemberPrincipal principal) {
        return principal == null ? null : principal.memberId();
    }
}
