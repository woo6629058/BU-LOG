package com.bulog.global.apiPayload.code;

import org.springframework.http.HttpStatus;

public record SuccessReasonDTO(
        HttpStatus httpStatus,
        Boolean isSuccess,
        String code,
        String message
) {
}
