package com.bulog.domain.halloffame.service;

import com.bulog.domain.halloffame.entity.Finisher;
import com.bulog.domain.halloffame.entity.HallRecord;
import com.bulog.domain.halloffame.repository.FinisherStore;
import com.bulog.domain.halloffame.repository.HallRecordStore;
import com.bulog.domain.member.entity.Member;
import com.bulog.domain.member.repository.MemberStore;
import com.bulog.domain.visitor.entity.Visitor;
import com.bulog.domain.visitor.repository.VisitorStore;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Supplier;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * local 프로필: 명예의 전당 화면을 볼 수 있게 예시 탐험가와 실시간 기록을 넣는다 (서버를 다시 켜면 처음부터).
 * 닉네임이 있는 탐험가는 예시 회원이고(로그인은 안 됨), 없는 탐험가는 게스트다.
 */
@Component
@Profile("local")
@RequiredArgsConstructor
public class LocalHallOfFameSeeder implements ApplicationRunner {

    // 완주자: 닉네임(null이면 게스트), 몇 분 전에 완주했는지, 탐험 시간(초)
    private record SampleFinisher(String nickname, long minutesAgo, long durationSeconds) {
    }

    // 아직 완주 전인 탐험가가 남긴 기록: 닉네임, 몇 분 전, 받은 유물(전시실 완료면 null), 전시실
    private record SampleProgress(String nickname, long minutesAgo, String exhibitId, String room) {
    }

    private static final List<SampleFinisher> FINISHERS = List.of(
            new SampleFinisher("도자기탐정", 60 * 52, 1520),
            new SampleFinisher(null, 60 * 49, 1302),
            new SampleFinisher("옹기사랑", 60 * 30, 1188),
            new SampleFinisher(null, 60 * 27, 987),
            new SampleFinisher("부천토박이", 60 * 26, 1405),
            new SampleFinisher(null, 60 * 25, 1250),
            new SampleFinisher("수석수집가", 60 * 7, 1094),
            new SampleFinisher(null, 60 * 5, 845),
            new SampleFinisher("박물관산책", 60 * 3, 1366),
            new SampleFinisher(null, 95, 768),
            new SampleFinisher("꼬마학예사", 48, 1022),
            new SampleFinisher(null, 22, 708),
            new SampleFinisher("부록탐험대", 3, 912)
    );

    private static final List<SampleProgress> PROGRESS = List.of(
            new SampleProgress("유럽여행", 70, "europe-sevres-vase", "유럽자기전시실"),
            new SampleProgress(null, 55, "local-half-moon-knife", "부천향토역사관"),
            new SampleProgress("유럽여행", 41, null, "유럽자기전시실"),
            new SampleProgress(null, 33, "ongi1-flower-jar", "옹기1전시실"),
            new SampleProgress("학교종", 26, "edu-school-bell", "교육전시실"),
            new SampleProgress(null, 18, "ongi2-sojutgori", "옹기2전시실"),
            new SampleProgress(null, 18, null, "옹기2전시실"),
            new SampleProgress("학교종", 11, "edu-diploma", "교육전시실"),
            new SampleProgress(null, 6, "stone-sunflower", "수석전시실"),
            new SampleProgress("유럽여행", 1, "stone-gwantong", "수석전시실"),
            new SampleProgress(null, 0, "local-spindle-whorl", "부천향토역사관")
    );

    private final VisitorStore visitorStore;
    private final MemberStore memberStore;
    private final FinisherStore finisherStore;
    private final HallRecordStore hallRecordStore;

    private final Map<String, Visitor> memberVisitors = new HashMap<>();
    private int sampleCount = 0;

    @Override
    public void run(ApplicationArguments args) {
        LocalDateTime now = LocalDateTime.now().withNano(0);
        // 기록 번호가 시간 순서대로 붙게 모아서 오래된 것부터 넣는다.
        List<Event> events = new ArrayList<>();
        for (SampleFinisher sample : FINISHERS) {
            Visitor visitor = sampleVisitor(sample.nickname());
            LocalDateTime finishedAt = now.minusMinutes(sample.minutesAgo());
            events.add(new Event(finishedAt, () -> {
                Finisher finisher = finisherStore.store(Finisher.create(
                        null,
                        visitor,
                        finishedAt.minusSeconds(sample.durationSeconds()),
                        finishedAt
                ));
                return HallRecord.finish(finisher);
            }));
        }
        List<Visitor> guests = new ArrayList<>();
        for (SampleProgress sample : PROGRESS) {
            Visitor visitor = sample.nickname() == null
                    ? guestFor(guests, sample)
                    : memberVisitor(sample.nickname());
            LocalDateTime at = now.minusMinutes(sample.minutesAgo()).minusSeconds(sampleCount);
            events.add(new Event(at, () -> sample.exhibitId() == null
                    ? HallRecord.roomDone(visitor, sample.room(), at)
                    : HallRecord.fill(visitor, sample.exhibitId(), sample.room(), at)));
        }
        events.stream()
                .sorted(Comparator.comparing(Event::at))
                .forEach(event -> hallRecordStore.store(event.record().get()));
    }

    private record Event(LocalDateTime at, Supplier<HallRecord> record) {
    }

    // 같은 전시실을 채우던 게스트는 같은 사람으로 둔다 (옹기2 소줏고리 → 옹기2 완료).
    private Visitor guestFor(List<Visitor> guests, SampleProgress sample) {
        if (sample.exhibitId() == null && !guests.isEmpty()) {
            return guests.getLast();
        }
        Visitor guest = sampleVisitor(null);
        guests.add(guest);
        return guest;
    }

    private Visitor memberVisitor(String nickname) {
        return memberVisitors.computeIfAbsent(nickname, this::sampleVisitor);
    }

    private Visitor sampleVisitor(String nickname) {
        sampleCount += 1;
        Visitor visitor = Visitor.create(null, "local-hall-of-fame-sample-" + sampleCount);
        if (nickname != null) {
            Member member = memberStore.store(Member.create(
                    null,
                    "sample" + sampleCount + "@bulog.local",
                    "local-sample-no-login",
                    nickname
            ));
            visitor.linkMember(member);
        }
        return visitorStore.store(visitor);
    }
}
