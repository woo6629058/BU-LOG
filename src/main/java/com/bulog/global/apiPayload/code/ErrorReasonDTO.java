package com.bulog.global.apiPayload.code;

import org.springframework.http.HttpStatus;

public record ErrorReasonDTO(
        HttpStatus httpStatus,
        Boolean isSuccess,
        String code,
        String message
) {
}
