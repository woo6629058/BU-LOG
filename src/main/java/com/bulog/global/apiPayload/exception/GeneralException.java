package com.bulog.global.apiPayload.exception;

import com.bulog.global.apiPayload.code.BaseErrorCode;
import com.bulog.global.apiPayload.code.ErrorReasonDTO;
import java.util.Map;

public class GeneralException extends RuntimeException {

    private final BaseErrorCode errorCode;
    private final Object errorDetail;

    public GeneralException(BaseErrorCode errorCode) {
        this(errorCode, Map.of());
    }

    public GeneralException(BaseErrorCode errorCode, Object errorDetail) {
        super(errorCode.getReason().message());
        this.errorCode = errorCode;
        this.errorDetail = errorDetail;
    }

    public BaseErrorCode getErrorCode() {
        return errorCode;
    }

    public Object getErrorDetail() {
        return errorDetail;
    }

    public ErrorReasonDTO getErrorReason() {
        return errorCode.getReason();
    }

    public ErrorReasonDTO getErrorReasonHttpStatus() {
        return errorCode.getReasonHttpStatus();
    }
}
