package com.bulog.domain.exhibit.repository;

import com.bulog.domain.exhibit.entity.Exhibit;
import java.util.Collection;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ExhibitRepository extends JpaRepository<Exhibit, String>, ExhibitCatalog {

    List<Exhibit> findAllByExternalIdIn(Collection<String> externalIds);

    @Override
    @Query("""
            select exhibit
            from Exhibit exhibit
            where exhibit.collectible = true
            order by exhibit.cardNumber asc, exhibit.name asc
            """)
    List<Exhibit> findAllCollectible();

    @Override
    @Query("""
            select exhibit
            from Exhibit exhibit
            where (:keyword is null
                   or lower(exhibit.name) like lower(concat('%', :keyword, '%')))
              and (:exhibitionRoom is null or exhibit.exhibitionRoom = :exhibitionRoom)
              and (:collectible is null or exhibit.collectible = :collectible)
            """)
    Page<Exhibit> search(
            @Param("keyword") String keyword,
            @Param("exhibitionRoom") String exhibitionRoom,
            @Param("collectible") Boolean collectible,
            Pageable pageable
    );
}
