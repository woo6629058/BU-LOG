package com.bulog.domain.collection.entity;

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
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(
        name = "collection_records",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_collection_record_visitor_exhibit",
                columnNames = {"visitor_id", "exhibit_id"}
        )
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CollectionRecord extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "visitor_id", nullable = false)
    private Visitor visitor;

    @Column(name = "exhibit_id", length = 100, nullable = false)
    private String exhibitId;

    @Column(name = "acquired_at", nullable = false, updatable = false)
    private LocalDateTime acquiredAt;

    private CollectionRecord(
            Long id,
            Visitor visitor,
            String exhibitId,
            LocalDateTime acquiredAt
    ) {
        if (visitor == null) {
            throw new IllegalArgumentException("visitor must not be null");
        }
        if (exhibitId == null || exhibitId.isBlank()) {
            throw new IllegalArgumentException("exhibitId must not be blank");
        }
        this.id = id;
        this.visitor = visitor;
        this.exhibitId = exhibitId.trim();
        this.acquiredAt = acquiredAt == null ? LocalDateTime.now() : acquiredAt;
    }

    public static CollectionRecord create(
            Long id,
            Visitor visitor,
            String exhibitId,
            LocalDateTime acquiredAt
    ) {
        return new CollectionRecord(id, visitor, exhibitId, acquiredAt);
    }
}
