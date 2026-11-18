package com.bulog.domain.halloffame.entity;

import com.bulog.domain.visitor.entity.Visitor;
import com.bulog.global.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.Duration;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 완주자: 수집 대상 유물 카드를 모두 모은 사람.
 * id가 완주 번호(No.1, No.2 …)다. 완주한 순간에 한 번 저장하고 바꾸지 않는다.
 */
@Getter
@Entity
@Table(
        name = "finishers",
        uniqueConstraints = @UniqueConstraint(name = "uk_finisher_visitor", columnNames = "visitor_id")
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Finisher extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 마지막 카드를 받은 방문자. 로그인한 회원이면 이 방문자에 회원이 이어져 있다. */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "visitor_id", nullable = false)
    private Visitor visitor;

    /** 첫 카드를 받은 시각 */
    @Column(name = "started_at", nullable = false)
    private LocalDateTime startedAt;

    /** 마지막 카드를 받은 시각 */
    @Column(name = "finished_at", nullable = false)
    private LocalDateTime finishedAt;

    private Finisher(Long id, Visitor visitor, LocalDateTime startedAt, LocalDateTime finishedAt) {
        if (visitor == null) {
            throw new IllegalArgumentException("visitor must not be null");
        }
        if (startedAt == null || finishedAt == null || finishedAt.isBefore(startedAt)) {
            throw new IllegalArgumentException("startedAt must not be after finishedAt");
        }
        this.id = id;
        this.visitor = visitor;
        this.startedAt = startedAt;
        this.finishedAt = finishedAt;
    }

    public static Finisher create(Long id, Visitor visitor, LocalDateTime startedAt, LocalDateTime finishedAt) {
        return new Finisher(id, visitor, startedAt, finishedAt);
    }

    /** 탐험 시간: 첫 카드부터 마지막 카드까지 (초) */
    public long getDurationSeconds() {
        return Duration.between(startedAt, finishedAt).toSeconds();
    }
}
