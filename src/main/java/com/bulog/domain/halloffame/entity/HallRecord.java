package com.bulog.domain.halloffame.entity;

import com.bulog.domain.visitor.entity.Visitor;
import com.bulog.global.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 명예의 전당 실시간 기록 한 줄. 유물을 새로 모을 때 함께 쌓인다. */
@Getter
@Entity
@Table(name = "hall_records", indexes = @Index(name = "idx_hall_record_occurred_at", columnList = "occurred_at"))
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class HallRecord extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private HallRecordType type;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "visitor_id", nullable = false)
    private Visitor visitor;

    /** FILL: 받은 유물 */
    @Column(name = "exhibit_id", length = 100)
    private String exhibitId;

    /** FILL, ROOM_DONE: 전시실 이름 */
    @Column(name = "exhibition_room", length = 100)
    private String exhibitionRoom;

    /** FINISH: 완주 기록 */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "finisher_id")
    private Finisher finisher;

    @Column(name = "occurred_at", nullable = false)
    private LocalDateTime occurredAt;

    private HallRecord(
            Long id,
            HallRecordType type,
            Visitor visitor,
            String exhibitId,
            String exhibitionRoom,
            Finisher finisher,
            LocalDateTime occurredAt
    ) {
        if (type == null || visitor == null || occurredAt == null) {
            throw new IllegalArgumentException("type, visitor, occurredAt must not be null");
        }
        this.id = id;
        this.type = type;
        this.visitor = visitor;
        this.exhibitId = exhibitId;
        this.exhibitionRoom = exhibitionRoom;
        this.finisher = finisher;
        this.occurredAt = occurredAt;
    }

    public static HallRecord fill(Visitor visitor, String exhibitId, String exhibitionRoom, LocalDateTime occurredAt) {
        return new HallRecord(null, HallRecordType.FILL, visitor, exhibitId, exhibitionRoom, null, occurredAt);
    }

    public static HallRecord roomDone(Visitor visitor, String exhibitionRoom, LocalDateTime occurredAt) {
        return new HallRecord(null, HallRecordType.ROOM_DONE, visitor, null, exhibitionRoom, null, occurredAt);
    }

    public static HallRecord finish(Finisher finisher) {
        return new HallRecord(
                null,
                HallRecordType.FINISH,
                finisher.getVisitor(),
                null,
                null,
                finisher,
                finisher.getFinishedAt()
        );
    }

    /** 같은 내용에 id만 붙인 사본 (DB 없이 실행하는 local 저장소에서 사용). */
    public HallRecord withId(Long newId) {
        return new HallRecord(newId, type, visitor, exhibitId, exhibitionRoom, finisher, occurredAt);
    }
}
