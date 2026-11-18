package com.bulog.domain.halloffame.service;

import com.bulog.domain.visitor.entity.Visitor;
import java.util.Locale;

/** 명예의 전당에 보이는 이름: 로그인한 회원은 닉네임, 게스트는 "게스트 0000". */
public final class ExplorerName {

    // 10000과 서로소라 방문자 1만 명까지는 번호가 겹치지 않고, 순서대로 붙지 않아 몇 번째 방문자인지 드러나지 않는다.
    private static final long GUEST_NUMBER_MULTIPLIER = 7919L;
    private static final long GUEST_NUMBER_RANGE = 10_000L;

    private ExplorerName() {
    }

    public static String of(Visitor visitor) {
        if (visitor.getMember() != null) {
            return visitor.getMember().getNickname();
        }
        return guest(visitor.getId());
    }

    public static String guest(Long visitorId) {
        return "게스트 " + guestNumber(visitorId);
    }

    static String guestNumber(Long visitorId) {
        long number = Math.floorMod(visitorId * GUEST_NUMBER_MULTIPLIER, GUEST_NUMBER_RANGE);
        return String.format(Locale.ROOT, "%04d", number);
    }
}
