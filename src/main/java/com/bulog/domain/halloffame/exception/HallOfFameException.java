package com.bulog.domain.halloffame.exception;

import com.bulog.domain.halloffame.exception.code.HallOfFameErrorCode;
import com.bulog.global.apiPayload.exception.GeneralException;
import java.util.Map;

public class HallOfFameException extends GeneralException {

    public HallOfFameException(HallOfFameErrorCode errorCode, Map<String, ?> errorDetail) {
        super(errorCode, errorDetail);
    }
}
