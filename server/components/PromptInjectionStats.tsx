import {
  createStyles,
  Text,
  Group,
  SimpleGrid,
  rem,
  Loader,
} from "@mantine/core";
import { useContext, useEffect, useState } from "react";
import { AppContext } from "./AppContext";

const useStyles = createStyles((theme) => ({
  stat: {
    borderBottom: `${rem(3)} solid`,
    paddingBottom: rem(5),
  },

  statCount: {
    fontFamily: `Greycliff CF, ${theme.fontFamily}`,
    lineHeight: 1.3,
  },
}));

export function PromptInjectionStats() {
  const { classes } = useStyles();
  const { appState, accountLoading } = useContext(AppContext);
  const [learnedAttackSignatures, setLearnedAttackSignatures] = useState(0);
  const [loadingSignatures, setLoadingSignatures] = useState(true);

  useEffect(() => {
    async function fetchSignatures() {
      setLoadingSignatures(true);
      try {
        const response = await fetch("/api/global-stats");
        const data = await response.json();
        setLearnedAttackSignatures(data.learnedAttackSignatures ?? 0);
      } catch (e) {
        // ignore
      } finally {
        setLoadingSignatures(false);
      }
    }
    fetchSignatures();
    const interval = setInterval(fetchSignatures, 5000); // auto-refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const stats = [
    {
      label: "total requests",
      count: `${appState?.stats?.requests ?? 0}`,
      part: null,
      textColor: "text-gray-500",
      borderColor: "border-gray-500",
      loading: accountLoading,
    },
    {
      label: "injections detected",
      count: `${appState?.stats?.detections ?? 0}`,
      part: null,
      textColor: "text-gray-500",
      borderColor: "border-gray-500",
      loading: accountLoading,
    },
    {
      label: "learned attack signatures",
      count: `${learnedAttackSignatures}`,
      part: null,
      textColor: "text-gray-500",
      borderColor: "border-green-700",
      loading: loadingSignatures,
    },
  ];

  return (
    <SimpleGrid cols={3} breakpoints={[{ maxWidth: "xs", cols: 1 }]} mt="xl">
      {stats.map((stat) => (
        <div key={stat.label} className={`${classes.stat} ${stat.borderColor}`}>
          <Text tt="uppercase" fz="xs" c="dimmed" fw={700}>
            {stat.label}
          </Text>

          <Group position="apart" align="flex-end" spacing={0}>
            {stat.loading ? (
              <Loader color="gray" variant="dots" />
            ) : (
              <Text fw={700}>{stat.count}</Text>
            )}
            {typeof stat.part === "number" && (
              <Text
                fw={700}
                size="sm"
                className={`${classes.statCount} ${stat.textColor}`}
              >
                {stat.part}%
              </Text>
            )}
          </Group>
        </div>
      ))}
    </SimpleGrid>
  );
}
