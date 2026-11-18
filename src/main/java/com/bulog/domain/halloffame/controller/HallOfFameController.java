package com.bulog.domain.halloffame.controller;

import com.bulog.domain.halloffame.dto.res.FinisherResponseDTO;
import com.bulog.domain.halloffame.dto.res.HallOfFameResponseDTO;
import com.bulog.domain.halloffame.exception.code.HallOfFameSuccessCode;
import com.bulog.domain.halloffame.service.HallOfFameService;
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
@RequestMapping("/api/hall-of-fame")
@RequiredArgsConstructor
public class HallOfFameController {

    private final HallOfFameService hallOfFameService;

    @GetMapping
    public ApiResponse<HallOfFameResponseDTO> getHallOfFame(
            @RequestAttribute(VisitorRequestFilter.VISITOR_ATTRIBUTE) Visitor visitor,
            @AuthenticationPrincipal MemberPrincipal principal
    ) {
        return ApiResponse.of(
                HallOfFameSuccessCode.HALL_OF_FAME_FOUND,
                hallOfFameService.getHallOfFame(visitor, principal == null ? null : principal.memberId())
        );
    }

    @GetMapping("/finishers/{no}")
    public ApiResponse<FinisherResponseDTO> getFinisher(@PathVariable Long no) {
        return ApiResponse.of(HallOfFameSuccessCode.FINISHER_FOUND, hallOfFameService.getFinisher(no));
    }
}
