package com.bulog.domain.quiz.dto.res;

import com.bulog.domain.card.dto.res.CardAcquisitionResponseDTO;
import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record QuizAttemptResponseDTO(
        boolean correct,
        String explanation,
        CardAcquisitionResponseDTO card
) {
}
