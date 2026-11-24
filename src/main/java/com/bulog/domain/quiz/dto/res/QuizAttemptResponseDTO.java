package com.bulog.domain.quiz.dto.res;

import com.bulog.domain.collection.dto.res.CollectionAcquisitionResponseDTO;
import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record QuizAttemptResponseDTO(
        boolean correct,
        String explanation,
        CollectionAcquisitionResponseDTO collection
) {
}
