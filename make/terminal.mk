LOGS_ORDER := bot streaming engine gateway battle auth profile orchestration

logs:
	@guake --show

	@guake --new-tab=$(CURDIR)\service\front
	@sleep 0.2
	@guake --rename-current-tab="front"

	@for service in $(LOGS_ORDER); do \
		guake --new-tab=$(CURDIR); \
		sleep 0.2; \
		guake --rename-current-tab="$$service"; \
		guake --execute-command="cd $(CURDIR) && docker compose logs -f $$service"; \
		sleep 0.2; \
	done

	@guake --new-tab=$(CURDIR)
	@sleep 0.2
	@guake --rename-current-tab="health"
	@guake --execute-command="cd $(CURDIR) && make healthloop"


#close-tabs:
#    @count=$(shell gdbus call --session \
#        --dest org.guake.Guake \
#        --object-path /org/guake/Guake \
#        --method org.guake.Guake.get_tab_count | awk '{print $$2}'); \
#    for i in $$(seq 1 $$((count-1))); do \
#        gdbus call --session \
#            --dest org.guake.Guake \
#            --object-path /org/guake/Guake \
#            --method org.guake.Guake.close_tab $$i; \
#    done
