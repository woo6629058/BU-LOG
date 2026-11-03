package com.bulog.domain.card.exception;

import com.bulog.domain.card.exception.code.CardErrorCode;
import com.bulog.global.apiPayload.exception.GeneralException;
import java.util.Map;

public class CardException extends GeneralException {

    public CardException(CardErrorCode errorCode, Map<String, ?> errorDetail) {
        super(errorCode, errorDetail);
    }
}
