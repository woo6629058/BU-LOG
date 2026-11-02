package com.bulog.global.apiPayload;

import com.bulog.global.apiPayload.code.BaseCode;
import com.bulog.global.apiPayload.code.BaseErrorCode;
import com.bulog.global.apiPayload.code.GeneralSuccessCode;
import com.bulog.global.apiPayload.code.SuccessReasonDTO;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import java.util.Map;

@JsonPropertyOrder({"isSuccess", "code", "message", "result", "errorDetail"})
public record ApiResponse<T>(
        boolean isSuccess,
        String code,
        String message,
        T result,
        Object errorDetail
) {

    public static ApiResponse<Void> onSuccess() {
        return of(GeneralSuccessCode.COMMON_200, null);
    }

    public static <T> ApiResponse<T> onSuccess(T result) {
        return of(GeneralSuccessCode.COMMON_200, result);
    }

    public static <T> ApiResponse<T> of(BaseCode code, T result) {
        SuccessReasonDTO reason = code.getReason();
        return new ApiResponse<>(reason.isSuccess(), reason.code(), reason.message(), result, null);
    }

    public static ApiResponse<Void> onFailure(BaseErrorCode errorCode) {
        return onFailure(errorCode, Map.of());
    }

    public static ApiResponse<Void> onFailure(BaseErrorCode errorCode, Object errorDetail) {
        var reason = errorCode.getReason();
        return new ApiResponse<>(reason.isSuccess(), reason.code(), reason.message(), null, errorDetail);
    }
}
