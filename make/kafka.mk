kafka-list-topics:
    docker compose exec kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --list

kafka-user-created-list:
    docker compose exec kafka /opt/kafka/bin/kafka-console-consumer.sh \
        --bootstrap-server localhost:9092 \
        --topic user.created \
        --from-beginning
